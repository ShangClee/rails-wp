module Api
  module V2
    class PostMetaController < ApplicationController
      before_action :authenticate_user!
      before_action :set_post

      # GET /api/v2/posts/:post_id/meta
      def index
        metas = @post.metas
        # Only admins/editors can see protected (_prefix) meta keys
        metas = metas.reject { |m| m.meta_key.start_with?("_") } unless current_user.admin? || current_user.editor?
        render json: metas.map { |m| meta_json(m) }
      end

      # POST /api/v2/posts/:post_id/meta
      def create
        unless current_user.admin? || current_user.editor? || (current_user.author? && @post.post_author == current_user.ID)
          return render json: { code: "rest_forbidden", message: "Unauthorized", data: { status: 403 } }, status: :forbidden
        end

        key = meta_params[:key].to_s
        value = meta_params[:value].to_s

        if key.blank?
          return render json: { code: "rest_invalid_params", message: "Meta key is required", data: { status: 400 } }, status: :bad_request
        end

        # Only admins can create protected meta keys
        if key.start_with?("_") && !current_user.admin?
          return render json: { code: "rest_forbidden", message: "Cannot set protected meta keys", data: { status: 403 } }, status: :forbidden
        end

        meta = @post.metas.create!(meta_key: key, meta_value: value)
        render json: meta_json(meta), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { code: "rest_invalid_params", message: e.message, data: { status: 400 } }, status: :bad_request
      end

      # PATCH /api/v2/posts/:post_id/meta/:id
      def update
        unless current_user.admin? || current_user.editor?
          return render json: { code: "rest_forbidden", message: "Unauthorized", data: { status: 403 } }, status: :forbidden
        end

        meta = @post.metas.find(params[:id])
        meta.update!(meta_value: meta_params[:value].to_s)
        render json: meta_json(meta)
      rescue ActiveRecord::RecordNotFound
        render json: { code: "rest_not_found", message: "Meta not found", data: { status: 404 } }, status: :not_found
      end

      # DELETE /api/v2/posts/:post_id/meta/:id
      def destroy
        unless current_user.admin? || current_user.editor?
          return render json: { code: "rest_forbidden", message: "Unauthorized", data: { status: 403 } }, status: :forbidden
        end

        meta = @post.metas.find(params[:id])
        meta.destroy!
        head :no_content
      rescue ActiveRecord::RecordNotFound
        render json: { code: "rest_not_found", message: "Meta not found", data: { status: 404 } }, status: :not_found
      end

      private

      def set_post
        @post = WpPost.find(params[:post_id])
      end

      def meta_params
        params.permit(:key, :value)
      end

      def meta_json(meta)
        {
          id: meta.meta_id,
          key: meta.meta_key,
          value: meta.meta_value,
          protected: meta.meta_key.start_with?("_")
        }
      end
    end
  end
end
