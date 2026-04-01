module Api
  module V2
    class RevisionsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_post

      # GET /api/v2/posts/:post_id/revisions
      def index
        revisions = @post.revisions.order(post_date: :desc)
        render json: revisions.map { |r| revision_json(r) }
      end

      # POST /api/v2/revisions/:id/restore
      def restore
        revision = WpPost.find(params[:id])
        post = WpPost.find(revision.post_parent)

        unless can_edit?(post)
          return render json: { code: "rest_forbidden", message: "Unauthorized", data: { status: 403 } }, status: :forbidden
        end

        service = PostService.new(current_user: current_user)
        result = service.update(post, {
          post_title: revision.post_title,
          post_content: revision.post_content,
          post_excerpt: revision.post_excerpt
        })

        if result[:success]
          render json: revision_json(revision), status: :ok
        else
          render json: { code: "rest_cannot_restore", message: result[:error], data: { status: 500 } }, status: :internal_server_error
        end
      end

      private

      def set_post
        @post = WpPost.find(params[:post_id]) if params[:post_id]
      end

      def can_edit?(post)
        current_user.admin? || current_user.editor? ||
          (current_user.author? && post.post_author == current_user.ID)
      end

      def revision_json(revision)
        {
          id: revision.ID,
          parent: revision.post_parent,
          date: revision.post_date,
          date_gmt: revision.post_date_gmt,
          slug: revision.post_name,
          author: revision.post_author,
          title: { rendered: revision.post_title },
          content: { rendered: revision.post_content },
          excerpt: { rendered: revision.post_excerpt }
        }
      end
    end
  end
end
