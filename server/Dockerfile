FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack prepare pnpm@10.14.0 --activate && pnpm install --frozen-lockfile

COPY . .

EXPOSE 5000

CMD ["pnpm", "backend"]
