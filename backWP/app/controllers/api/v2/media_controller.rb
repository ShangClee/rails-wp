module Api
  module V2
    class MediaController < ApplicationController
      before_action :authenticate_user!
      before_action :set_media, only: [ :show, :destroy ]

      # GET /api/v2/media
      def index
        query = WpPost.where(post_type: "attachment")

        # Filter by post parent if specified
        query = query.where(post_parent: params[:parent]) if params[:parent].present?

        # Filter by mime type if specified (exact) or media type prefix (image, video, audio, application)
        if params[:mime_type].present?
          query = query.where(post_mime_type: params[:mime_type])
        elsif params[:media_type].present?
          query = query.where("post_mime_type LIKE ?", "#{params[:media_type]}/%")
        end

        # Filter by search
        if params[:search].present?
          search_term = "%#{params[:search]}%"
          query = query.where("post_title LIKE ?", search_term)
        end

        page = [ params[:page].to_i, 1 ].max
        per_page = params[:per_page].to_i
        per_page = 10 if per_page <= 0

        @media = query.includes(:author, :metas)
                      .recent
                      .offset((page - 1) * per_page)
                      .limit(per_page)

        # Add WordPress-compatible headers
        total_media = query.count
        response.headers["X-WP-Total"] = total_media.to_s
        response.headers["X-WP-TotalPages"] = ((total_media.to_f / per_page).ceil).to_s

        collection_info = {
          params: params.merge(page: [ params[:page].to_i, 1 ].max, per_page: per_page),
          total_count: total_media
        }

        render json: WpPostSerializer.new(@media, collection_info: collection_info).serializable_hash
      end

      # POST /api/v2/media
      def create
        unless current_user.admin? || current_user.editor? || current_user.author?
          return render json: {
            code: "rest_forbidden",
            message: "Sorry, you are not allowed to upload media.",
            data: { status: 401 }
          }, status: :unauthorized
        end

        file = params[:file]
        return render json: {
          code: "rest_missing_callback_arg",
          message: "Missing required parameter: file",
          data: { status: 400, param: "file" }
        }, status: :bad_request unless file

        filename = file.original_filename
        mime_type = file.content_type

        @attachment = WpPost.new(
          post_author: current_user.ID,
          post_date: Time.now,
          post_date_gmt: Time.now.utc,
          post_content: "",
          post_title: filename,
          post_excerpt: "",
          post_status: "inherit",
          comment_status: "open",
          ping_status: "closed",
          post_name: filename.parameterize,
          post_modified: Time.now,
          post_modified_gmt: Time.now.utc,
          post_type: "attachment",
          post_mime_type: mime_type,
          guid: "#{request.base_url}/wp-content/uploads/#{Time.now.year}/#{Time.now.month}/#{filename}" # Simulation
        )

        if @attachment.save
          now = Time.now
          upload_path = "#{now.year}/#{now.strftime('%m')}/#{filename}"

          # WordPress-standard _wp_attached_file meta
          WpPostmeta.create!(
            post_id: @attachment.ID,
            meta_key: "_wp_attached_file",
            meta_value: upload_path
          )

          # WordPress-standard _wp_attachment_metadata for images
          if mime_type.start_with?("image/")
            metadata = {
              file: upload_path,
              sizes: {},
              image_meta: {}
            }
            WpPostmeta.create!(
              post_id: @attachment.ID,
              meta_key: "_wp_attachment_metadata",
              meta_value: metadata.to_json
            )
          end

          render json: WpPostSerializer.new(@attachment).serializable_hash, status: :created
        else
          render json: {
            code: "rest_invalid_params",
            message: "Invalid media data.",
            data: { status: 400, details: @attachment.errors.messages }
          }, status: :unprocessable_entity
        end
      end

      # GET /api/v2/media/:id
      def show
        json = Rails.cache.fetch("media/#{@media.id}", expires_in: 12.hours) do
          WpPostSerializer.new(@media).serializable_hash.to_json
        end
        render json: json
      end

      # DELETE /api/v2/media/:id
      def destroy
        unless can_delete_media?
          return render json: {
            code: "rest_forbidden",
            message: "Sorry, you are not allowed to delete this media.",
            data: { status: 401 }
          }, status: :unauthorized
        end

        if @media.destroy
          head :no_content
        else
          render json: {
            code: "rest_cannot_delete",
            message: "Failed to delete media.",
            data: { status: 500 }
          }, status: :internal_server_error
        end
      end

      private

      def set_media
        @media = WpPost.where(post_type: "attachment").find(params[:id])
      end

      def can_delete_media?
        return true if current_user.admin? || current_user.editor?
        return true if current_user.author? && @media.post_author == current_user.ID
        false
      end
    end
  end
end
