module Api
  module V2
    class PostsController < ApplicationController
      before_action :authenticate_user!, only: [:create, :update, :destroy]
      before_action :set_post, only: [:show, :update, :destroy]

      # GET /api/v2/posts
      def index
        page = [params[:page].to_i, 1].max
        per_page = params[:per_page].to_i
        per_page = 10 if per_page <= 0

        @posts = Rails.cache.fetch("posts/page/#{page}/per_page/#{per_page}", expires_in: 12.hours) do
          offset = (page - 1) * per_page
          WpPost.published.posts.includes(:author, :metas, term_taxonomies: :term).recent
            .offset(offset).limit(per_page).to_a
        end

        render json: WpPostSerializer.new(@posts).serializable_hash
      end

      # GET /api/v2/posts/:id
      def show
        json = Rails.cache.fetch("posts/#{@post.id}", expires_in: 12.hours) do
          WpPostSerializer.new(@post).serializable_hash.to_json
        end
        render json: json
      end

      # POST /api/v2/posts
      def create
        service = PostService.new(current_user: current_user)
        result = service.create(post_params)

        if result[:success]
          render json: WpPostSerializer.new(result[:post]).serializable_hash, status: :created
        else
          render json: { error: result[:error] }, status: :forbidden
        end
      end

      # PUT/PATCH /api/v2/posts/:id
      def update
        service = PostService.new(current_user: current_user)
        result = service.update(@post, post_params)

        if result[:success]
          render json: WpPostSerializer.new(result[:post]).serializable_hash
        else
          render json: { error: result[:error] }, status: :forbidden
        end
      end

      # DELETE /api/v2/posts/:id
      def destroy
        service = PostService.new(current_user: current_user)
        result = service.destroy(@post)

        if result[:success]
          head :no_content
        else
          render json: { error: result[:error] }, status: :forbidden
        end
      end

      private

      def set_post
        @post = WpPost.find(params[:id])
      end

      def post_params
        params.require(:post).permit(:post_title, :post_content, :post_excerpt, :post_status, :post_name)
      end
    end
  end
end
