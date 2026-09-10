FROM golang:1.25.0-alpine AS builder
RUN apk add --no-cache git
WORKDIR /src
RUN git init && git remote add origin https://github.com/openimsdk/chat.git \
    && git fetch --depth 1 origin 22dc25e296aef327fb6779079c2a8b5b8fce83db \
    && git checkout --detach FETCH_HEAD
COPY favorites.patch /tmp/favorites.patch
RUN git apply --check /tmp/favorites.patch && git apply /tmp/favorites.patch
RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build \
    GOMAXPROCS=2 CGO_ENABLED=0 go build -p 2 -o /out/chat-api ./cmd/api/chat-api

FROM openim/openim-chat:v1.8.4-patch.5
ARG TARGETARCH
COPY --from=builder /out/chat-api /openim-chat/_output/bin/platforms/linux/${TARGETARCH}/chat-api
