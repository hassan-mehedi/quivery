FROM node:25-alpine
WORKDIR /app
COPY package.json yarn.lock ./
COPY prisma ./prisma
RUN yarn install --frozen-lockfile
COPY . .
EXPOSE 3000
CMD ["yarn", "dev"]