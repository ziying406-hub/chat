package controller

import (
	"context"
	"fmt"
	"testing"

	"github.com/golang-jwt/jwt/v4"
	"github.com/openimsdk/protocol/constant"
	"github.com/openimsdk/tools/tokenverify"
)

func TestWebOnlyMultiLogin(t *testing.T) {
	const secret = "test-web-login-secret"
	for _, test := range []struct {
		name                                      string
		incoming, webCount, nativeCount, wantKick int
	}{
		{"second web preserves first", 5, 1, 0, 0},
		{"native login preserves all web tokens", 1, 2, 1, 1},
		{"web login preserves native instance", 5, 2, 1, 0},
		{"web limit still enforced", 5, 30, 0, 1},
	} {
		t.Run(test.name, func(t *testing.T) {
			tokens := map[int]map[string]int{}
			for platform, count := range map[int]int{5: test.webCount, 1: test.nativeCount} {
				if count == 0 {
					continue
				}
				tokens[platform] = map[string]int{}
				for i := 0; i < count; i++ {
					claims := tokenverify.BuildClaims(fmt.Sprintf("qa-%d", i), platform, 3600)
					token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
					if err != nil {
						t.Fatal(err)
					}
					tokens[platform][token] = constant.NormalToken
				}
			}
			db := authDatabase{accessSecret: secret, multiLogin: multiLoginConfig{Policy: constant.AllLoginButSameTermKick, MaxNumOneEnd: 30}}
			deleted, kicked, err := db.checkToken(context.Background(), tokens, test.incoming)
			if err != nil || len(deleted) != 0 || len(kicked) != test.wantKick {
				t.Fatalf("deleted=%d kicked=%d want=%d err=%v", len(deleted), len(kicked), test.wantKick, err)
			}
			if test.incoming == 1 {
				for _, token := range kicked {
					if _, exists := tokens[5][token]; exists {
						t.Fatal("non-Web login kicked a Web token")
					}
				}
			}
		})
	}
}
