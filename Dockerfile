# Sử dụng Node.js 20-alpine làm base image
FROM node:20-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json để cài đặt dependencies
COPY package*.json ./

# Cài đặt các thư viện phụ thuộc
RUN npm install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Mở cổng 5173 để có thể kết nối từ bên ngoài
EXPOSE 5173

# Chạy server phát triển của Vite
CMD ["npm", "run", "dev"]
