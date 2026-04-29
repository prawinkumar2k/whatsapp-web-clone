FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack prepare pnpm@10.14.0 --activate && pnpm install --frozen-lockfile

COPY . .

ENV USE_SEPARATE_BACKEND=true

EXPOSE 5173

CMD ["pnpm", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
