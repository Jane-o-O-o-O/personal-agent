FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && \
    # 安装 Git
    apt-get install -y git && \
    # 清理缓存以减小镜像大小
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip && \
    pip install uv

COPY pyproject.toml* /app/

COPY . /app

RUN uv sync && uv pip install --system .

EXPOSE 8000

CMD ["uv", "run", "mcp-server-sec-agent", "-t", "sse"]