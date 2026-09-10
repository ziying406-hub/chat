FROM golang:1.24-alpine AS builder
RUN apk add --no-cache git
WORKDIR /src
RUN git clone --depth 1 --branch v3.8.3-patch.15 https://github.com/openimsdk/open-im-server.git .
COPY group-permissions.patch /tmp/group-permissions.patch
RUN git apply --check /tmp/group-permissions.patch && git apply /tmp/group-permissions.patch
RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build \
    GOMAXPROCS=2 CGO_ENABLED=0 go build -p 2 -o /out/openim-rpc-group ./cmd/openim-rpc/openim-rpc-group

COPY web-multilogin.patch /tmp/web-multilogin.patch
COPY web_multilogin_test.go pkg/common/storage/controller/web_multilogin_test.go
RUN git apply --check /tmp/web-multilogin.patch && git apply /tmp/web-multilogin.patch
RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build \
    GOMAXPROCS=2 CGO_ENABLED=0 go test -p 2 ./pkg/common/storage/controller -run TestWebOnlyMultiLogin -count=1 && \
    GOMAXPROCS=2 CGO_ENABLED=0 go build -p 2 -o /out/openim-rpc-auth ./cmd/openim-rpc/openim-rpc-auth && \
    GOMAXPROCS=2 CGO_ENABLED=0 go build -p 2 -o /out/openim-msggateway ./cmd/openim-msggateway

FROM openim/openim-server:v3.8.3-patch.15
ARG TARGETARCH
COPY --from=builder /out/openim-rpc-group /openim-server/_output/bin/platforms/linux/${TARGETARCH}/openim-rpc-group
COPY --from=builder /out/openim-rpc-auth /openim-server/_output/bin/platforms/linux/${TARGETARCH}/openim-rpc-auth
COPY --from=builder /out/openim-msggateway /openim-server/_output/bin/platforms/linux/${TARGETARCH}/openim-msggateway
