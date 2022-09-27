FROM ubuntu:22.04

#########################
# Install prerequisites #
#########################

RUN \
  apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl git libxml2

#########################
# Install WASI SDK 16.0 #
#########################

RUN curl -L https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-16/wasi-sdk-16.0-linux.tar.gz | tar xzk --strip-components=1 -C /

#####################
# Build actual code #
#####################

WORKDIR /code

RUN \
  curl -L https://raw.githubusercontent.com/openbsd/src/96592628355e0575112b755fdb484fe319f3a436/lib/libc/crypt/bcrypt.c > bcrypt.c && \
  curl -L https://raw.githubusercontent.com/openbsd/src/96592628355e0575112b755fdb484fe319f3a436/lib/libc/crypt/blowfish.c > blowfish.c && \
  curl -L https://raw.githubusercontent.com/openbsd/src/96592628355e0575112b755fdb484fe319f3a436/include/blf.h > blf.h && \
  curl -L https://raw.githubusercontent.com/openbsd/src/96592628355e0575112b755fdb484fe319f3a436/include/pwd.h > pwd.h

ADD bcrypt.patch bcrypt.patch
RUN patch < bcrypt.patch

# Relase build
RUN clang --sysroot=/share/wasi-sysroot --target=wasm32-unknown-wasi -I. -Wno-everything -flto -O3     -o bcrypt.wasm -D__BSD_VISIBLE -D__BEGIN_DECLS= -D__END_DECLS= -D'DEF_WEAK(x)=' -mexec-model=reactor -fvisibility=hidden -Wl,--export=malloc,--export=free,--export=bcrypt_gensalt,--export=bcrypt,--strip-all -- bcrypt.c blowfish.c

# Debug build
# RUN clang --sysroot=/share/wasi-sysroot --target=wasm32-unknown-wasi -I.                 -flto -O0 -g3 -o bcrypt.wasm -D__BSD_VISIBLE -D__BEGIN_DECLS= -D__END_DECLS= -D'DEF_WEAK(x)=' -mexec-model=reactor -fvisibility=hidden -Wl,--export=malloc,--export=free,--export=bcrypt_gensalt,--export=bcrypt             -- bcrypt.c blowfish.c

CMD base64 --wrap=0 bcrypt.wasm
