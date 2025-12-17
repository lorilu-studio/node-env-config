#!/bin/bash

# 多架构Docker构建脚本
# 支持 amd64 和 arm64 架构

set -e

# 配置变量
IMAGE_NAME="env-manager"
VERSION="1.0.0"
DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME:-}"  # 从环境变量获取，如果未设置则为空

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker Buildx插件
    if ! docker buildx version &> /dev/null; then
        print_error "Docker Buildx插件未安装，请先安装Docker Buildx"
        exit 1
    fi
}

# 设置多架构构建器
setup_builder() {
    print_info "设置多架构构建器..."
    
    # 创建并使用新的构建器实例
    docker buildx create --name multiarch-builder --use --bootstrap 2>/dev/null || {
        print_warn "构建器已存在，使用现有构建器"
        docker buildx use multiarch-builder
    }
    
    # 检查构建器状态
    docker buildx inspect --bootstrap
}

# 构建多架构镜像
build_image() {
    print_info "开始构建多架构Docker镜像..."
    print_info "支持架构: linux/amd64, linux/arm64"
    
    # 构建参数
    BUILD_ARGS=""
    if [ -n "$DOCKER_HUB_USERNAME" ]; then
        FULL_IMAGE_NAME="${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
        BUILD_ARGS="--push"
    else
        FULL_IMAGE_NAME="${IMAGE_NAME}:${VERSION}"
        BUILD_ARGS="--load"
    fi
    
    # 构建命令
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --tag "${FULL_IMAGE_NAME}" \
        ${BUILD_ARGS} \
        .
    
    print_info "镜像构建完成: ${FULL_IMAGE_NAME}"
}

# 添加额外标签
add_tags() {
    if [ -n "$DOCKER_HUB_USERNAME" ]; then
        print_info "添加额外标签..."
        
        # 添加主版本标签
        docker buildx imagetools create \
            "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION}" \
            --tag "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:1.0"
        
        # 添加latest标签
        docker buildx imagetools create \
            "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION}" \
            --tag "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:latest"
        
        print_info "标签添加完成"
    fi
}

# 验证镜像
verify_image() {
    if [ -n "$DOCKER_HUB_USERNAME" ]; then
        print_info "验证多架构镜像..."
        docker buildx imagetools inspect "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
    else
        print_info "本地镜像验证..."
        docker images | grep "${IMAGE_NAME}"
    fi
}

# 主函数
main() {
    print_info "开始多架构Docker构建流程..."
    
    # 检查环境
    check_docker
    
    # 设置构建器
    setup_builder
    
    # 构建镜像
    build_image
    
    # 添加标签
    add_tags
    
    # 验证镜像
    verify_image
    
    print_info "多架构Docker构建完成！"
    
    if [ -n "$DOCKER_HUB_USERNAME" ]; then
        print_info "镜像已推送到Docker Hub: ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
        print_info "使用以下命令拉取镜像:"
        print_info "docker pull ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
    else
        print_warn "未设置DOCKER_HUB_USERNAME环境变量，镜像仅在本地构建"
        print_info "要推送到Docker Hub，请设置环境变量并重新运行:"
        print_info "export DOCKER_HUB_USERNAME=your-username"
        print_info "./build-multiarch.sh"
    fi
}

# 执行主函数
main "$@"