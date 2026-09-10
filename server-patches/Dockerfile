FROM golang:1.24-alpine AS builder
RUN apk add --no-cache git
WORKDIR /src
RUN git clone --depth 1 --branch v3.8.3-patch.15 https://github.com/openimsdk/open-im-server.git .
COPY group-permissions.patch /tmp/group-permissions.patch
RUN git apply --check /tmp/group-permissions.patch && git apply /tmp/group-permissions.patch
RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build \
    GOMAXPROCS=2 CGO_ENABLED=0 go build -p 2 -o /out/openim-rpc-group ./cmd/openim-rpc/openim-rpc-group

FROM openim/openim-server:v3.8.3-patch.15
ARG TARGETARCH
COPY --from=builder /out/openim-rpc-group /openim-server/_output/bin/platforms/linux/${TARGETARCH}/openim-rpc-group
