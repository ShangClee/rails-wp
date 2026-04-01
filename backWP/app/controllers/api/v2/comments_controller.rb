module Api
  module V2
    class CommentsController < ApplicationController
      before_action :authenticate_user!, only: [ :update, :destroy, :approve, :unapprove, :spam, :trash ]
      before_action :set_comment, only: [ :show, :update, :destroy, :approve, :unapprove, :spam, :trash ]

      # GET /api/v2/comments
      def index
        query = WpComment.all
        query = query.where(comment_post_ID: params[:post_id]) if params[:post_id].present?
        query = query.where(user_id: params[:author]) if params[:author].present?

        # Handle status parameter (WP-standard: approve, hold, spam, trash)
        if params[:status].present?
          case params[:status]
          when "approve" then query = query.where(comment_approved: "1")
          when "hold"    then query = query.where(comment_approved: "0")
          when "spam"    then query = query.where(comment_approved: "spam")
          when "trash"   then query = query.where(comment_approved: "trash")
          end
        end

        # Handle approved parameter (true/false) — legacy support
        if params[:approved].present?
          if params[:approved] == "true"
            query = query.where(comment_approved: "1")
          elsif params[:approved] == "false"
            query = query.where(comment_approved: "0")
          end
        end

        page = [ params[:page].to_i, 1 ].max
        per_page = params[:per_page].to_i
        per_page = 20 if per_page <= 0

        @comments = query.includes(:user, :post)
                         .order(comment_date: :desc)
                         .offset((page - 1) * per_page)
                         .limit(per_page)

        # Add WordPress-compatible headers
        total_comments = query.count
        response.headers["X-WP-Total"] = total_comments.to_s
        response.headers["X-WP-TotalPages"] = ((total_comments.to_f / per_page).ceil).to_s

        collection_info = {
          params: params.merge(page: [ params[:page].to_i, 1 ].max, per_page: per_page),
          total_count: total_comments
        }

        render json: WpCommentSerializer.new(@comments, collection_info: collection_info).serializable_hash
      end

      # GET /api/v2/comments/:id
      def show
        json = Rails.cache.fetch("comments/#{@comment.id}", expires_in: 12.hours) do
          WpCommentSerializer.new(@comment).serializable_hash.to_json
        end
        render json: json
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
          # WordPress-compatible error response
          render json: {
            code: "rest_comment_invalid_params",
            message: result[:error],
            data: { status: 400 }
          }, status: :bad_request
        end
      end

      # PATCH/PUT /api/v2/comments/:id
      def update
        unless can_update_comment?
          return render json: {
            code: "rest_forbidden",
            message: "Sorry, you are not allowed to edit this comment.",
            data: { status: 401 }
          }, status: :unauthorized
        end

        if @comment.update(comment_update_params)
          render json: WpCommentSerializer.new(@comment).serializable_hash
        else
          render json: {
            code: "rest_comment_invalid_params",
            message: "Invalid comment data.",
            data: { status: 400, details: @comment.errors.messages }
          }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v2/comments/:id
      def destroy
        unless can_delete_comment?
          return render json: {
            code: "rest_forbidden",
            message: "Sorry, you are not allowed to delete this comment.",
            data: { status: 401 }
          }, status: :unauthorized
        end

        approved = @comment.comment_approved == "1"
        if @comment.destroy
          # Decrement comment count only if it was an approved comment
          post = @comment.post
          if post && approved
            post.decrement!(:comment_count) if post.comment_count > 0
          end
          head :no_content
        else
          render json: {
            code: "rest_comment_cannot_delete",
            message: "Failed to delete comment.",
            data: { status: 500 }
          }, status: :internal_server_error
        end
      end

      # PATCH /api/v2/comments/:id/approve
      def approve
        return render_forbidden unless current_user.admin? || current_user.editor?
        was_approved = @comment.comment_approved == "1"
        @comment.update!(comment_approved: "1")
        @comment.post&.increment!(:comment_count) unless was_approved
        Rails.cache.delete("comments/#{@comment.id}")
        render json: WpCommentSerializer.new(@comment).serializable_hash
      end

      # PATCH /api/v2/comments/:id/unapprove
      def unapprove
        return render_forbidden unless current_user.admin? || current_user.editor?
        was_approved = @comment.comment_approved == "1"
        @comment.update!(comment_approved: "0")
        @comment.post&.decrement!(:comment_count) if was_approved && @comment.post&.comment_count.to_i > 0
        Rails.cache.delete("comments/#{@comment.id}")
        render json: WpCommentSerializer.new(@comment).serializable_hash
      end

      # PATCH /api/v2/comments/:id/spam
      def spam
        return render_forbidden unless current_user.admin? || current_user.editor?
        was_approved = @comment.comment_approved == "1"
        @comment.update!(comment_approved: "spam")
        @comment.post&.decrement!(:comment_count) if was_approved && @comment.post&.comment_count.to_i > 0
        Rails.cache.delete("comments/#{@comment.id}")
        render json: WpCommentSerializer.new(@comment).serializable_hash
      end

      # PATCH /api/v2/comments/:id/trash
      def trash
        return render_forbidden unless current_user.admin? || current_user.editor?
        was_approved = @comment.comment_approved == "1"
        @comment.update!(comment_approved: "trash")
        @comment.post&.decrement!(:comment_count) if was_approved && @comment.post&.comment_count.to_i > 0
        Rails.cache.delete("comments/#{@comment.id}")
        render json: WpCommentSerializer.new(@comment).serializable_hash
      end

      private

      def render_forbidden
        render json: { code: "rest_forbidden", message: "Sorry, you are not allowed to moderate comments.", data: { status: 403 } }, status: :forbidden
      end

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
