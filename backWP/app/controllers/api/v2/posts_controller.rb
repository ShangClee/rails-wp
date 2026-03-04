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
        unless current_user.admin? || current_user.editor? || current_user.author?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        @post = WpPost.new(post_params)
        @post.post_author = current_user.ID
        @post.post_date = Time.now
        @post.post_date_gmt = Time.now.utc
        @post.post_modified = Time.now
        @post.post_modified_gmt = Time.now.utc
        @post.post_type = 'post'
        @post.comment_status = 'open'
        @post.ping_status = 'open'
        @post.to_ping = ''
        @post.pinged = ''
        @post.post_content_filtered = ''

        if @post.save
          render json: WpPostSerializer.new(@post).serializable_hash, status: :created
        else
          render json: { errors: @post.errors }, status: :unprocessable_entity
        end
      end

      # PUT/PATCH /api/v2/posts/:id
      def update
        unless can_edit_post?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        @post.post_modified = Time.now
        @post.post_modified_gmt = Time.now.utc

        if @post.update(post_params)
          render json: WpPostSerializer.new(@post).serializable_hash
        else
          render json: { errors: @post.errors }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v2/posts/:id
      def destroy
        unless can_delete_post?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        @post.destroy
        head :no_content
      end

      private

      def set_post
        @post = WpPost.find(params[:id])
      end

      def post_params
        params.require(:post).permit(:post_title, :post_content, :post_excerpt, :post_status, :post_name)
      end

      def can_edit_post?
        return true if current_user.admin? || current_user.editor?
        return true if current_user.author? && @post.post_author == current_user.ID
        false
      end

      def can_delete_post?
        can_edit_post?
      end
    end
  end
end
