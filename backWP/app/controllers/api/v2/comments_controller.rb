module Api
  module V2
    class CommentsController < ApplicationController
      before_action :authenticate_user!, only: [:update, :destroy]
      before_action :set_comment, only: [:show, :update, :destroy]

      # GET /api/v2/comments
      def index
        query = WpComment.all
        query = query.where(comment_post_ID: params[:post_id]) if params[:post_id].present?
        query = query.approved if params[:approved].present?

        page = [params[:page].to_i, 1].max
        per_page = params[:per_page].to_i
        per_page = 20 if per_page <= 0

        @comments = query.includes(:user, :post)
                        .order(comment_date: :desc)
                        .offset((page - 1) * per_page)
                        .limit(per_page)

        render json: WpCommentSerializer.new(@comments).serializable_hash
      end

      # GET /api/v2/comments/:id
      def show
        render json: WpCommentSerializer.new(@comment).serializable_hash
      end

      # POST /api/v2/comments
      def create
        ip_address = request.remote_ip
        user_agent = request.user_agent

        service = CreateCommentService.new(
          post_id: comment_params[:comment_post_ID],
          params: comment_params,
          user: current_user,
          ip_address: ip_address,
          user_agent: user_agent
        )

        result = service.call

        if result[:success]
          render json: WpCommentSerializer.new(result[:comment]).serializable_hash, status: :created
        else
          render json: { error: result[:error] }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v2/comments/:id
      def update
        unless can_update_comment?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        if @comment.update(comment_update_params)
          render json: WpCommentSerializer.new(@comment).serializable_hash
        else
          render json: { errors: @comment.errors }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v2/comments/:id
      def destroy
        unless can_delete_comment?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        @comment.destroy
        head :no_content
      end

      private

      def set_comment
        @comment = WpComment.find(params[:id])
      end

      def comment_params
        params.require(:comment).permit(:comment_post_ID, :comment_author, :comment_author_email,
                                       :comment_author_url, :comment_content, :comment_parent)
      end

      def comment_update_params
        # Only allow updating approval status and content for moderators
        if current_user.admin? || current_user.editor?
          params.require(:comment).permit(:comment_content, :comment_approved)
        else
          # Authors can only update their own comment content
          params.require(:comment).permit(:comment_content)
        end
      end

      def can_update_comment?
        return true if current_user.admin? || current_user.editor?
        return false unless current_user
        # Authors can update their own comments
        @comment.user_id == current_user.ID
      end

      def can_delete_comment?
        return true if current_user.admin? || current_user.editor?
        false
      end
    end
  end
end
