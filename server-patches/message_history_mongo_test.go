package mgo

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/openimsdk/open-im-server/v3/pkg/common/storage/model"
	"github.com/openimsdk/tools/errs"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func TestLatestVisibleMessage(t *testing.T) {
	uri := os.Getenv("OPENIM_TEST_MONGO_URI")
	if uri == "" {
		t.Skip("OPENIM_TEST_MONGO_URI is required for this MongoDB integration test")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		t.Fatal(err)
	}
	defer client.Disconnect(ctx)
	coll := client.Database("history_qa").Collection("messages")
	defer coll.Drop(ctx)
	message := func(seq int64, status int32, deleted ...string) *model.MsgInfoModel {
		return &model.MsgInfoModel{Msg: &model.MsgDataModel{Seq: seq, Status: status}, DelList: deleted}
	}
	// All messages in the newest block are deleted by Alice; Bob keeps the newest valid message.
	_, err = coll.InsertMany(ctx, []interface{}{
		model.MsgDocModel{DocID: "sg_history_qa:0", Msg: []*model.MsgInfoModel{message(1, 1), message(2, 1, "alice")}},
		model.MsgDocModel{DocID: "sg_history_qa:1", Msg: []*model.MsgInfoModel{message(101, 1, "alice"), message(102, 1, "alice"), message(103, 4)}},
		model.MsgDocModel{DocID: "sg_all_deleted_qa:0", Msg: []*model.MsgInfoModel{message(1, 1, "alice")}},
	})
	if err != nil {
		t.Fatal(err)
	}
	db := &MsgMgo{coll: coll}
	for _, test := range []struct {
		user string
		seq  int64
	}{{"alice", 1}, {"bob", 102}} {
		t.Run(test.user, func(t *testing.T) {
			last, err := db.GetLastMessage(ctx, "sg_history_qa", test.user)
			if err != nil {
				t.Fatal(err)
			}
			if last.Msg.Seq != test.seq {
				t.Fatalf("latest visible seq = %d, want %d", last.Msg.Seq, test.seq)
			}
		})
	}
	if _, err := db.GetLastMessage(ctx, "sg_all_deleted_qa", "alice"); errs.Unwrap(err) != mongo.ErrNoDocuments {
		t.Fatalf("all deleted: want no message, got %v", err)
	}
}
