module Api
  module V2
    class MediaController < ApplicationController
      before_action :authenticate_user!
      before_action :set_media, only: [:show, :destroy]

      # GET /api/v2/media
      def index
        @media = WpPost.where(post_type: 'attachment').recent
        render json: WpPostSerializer.new(@media).serializable_hash
      end

      # POST /api/v2/media
      def create
        unless current_user.admin? || current_user.editor? || current_user.author?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        file = params[:file]
        return render json: { error: 'No file uploaded' }, status: :unprocessable_entity unless file

        # In a real WP scenario, we'd move the file to wp-content/uploads
        # For this Rails ref impl, we'll simulate it or use ActiveStorage if fully integrated.
        # Here we simulate the WP attachment creation structure.
        
        filename = file.original_filename
        mime_type = file.content_type
        
        @attachment = WpPost.new(
          post_author: current_user.ID,
          post_date: Time.now,
          post_date_gmt: Time.now.utc,
          post_content: '',
          post_title: filename,
          post_excerpt: '',
          post_status: 'inherit',
          comment_status: 'open',
          ping_status: 'closed',
          post_name: filename.parameterize,
          post_modified: Time.now,
          post_modified_gmt: Time.now.utc,
          post_type: 'attachment',
          post_mime_type: mime_type,
          guid: "http://localhost:3000/wp-content/uploads/#{Time.now.year}/#{Time.now.month}/#{filename}" # Simulation
        )

        if @attachment.save
          # Create meta for file path
          WpPostmeta.create!(
            post_id: @attachment.ID,
            meta_key: '_wp_attached_file',
            meta_value: "#{Time.now.year}/#{Time.now.month}/#{filename}"
          )
          
          render json: WpPostSerializer.new(@attachment).serializable_hash, status: :created
        else
          render json: { errors: @attachment.errors }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v2/media/:id
      def destroy
        unless can_delete_media?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        @media.destroy
        head :no_content
      end

      private

      def set_media
        @media = WpPost.where(post_type: 'attachment').find(params[:id])
      end

      def can_delete_media?
        return true if current_user.admin? || current_user.editor?
        return true if current_user.author? && @media.post_author == current_user.ID
        false
      end
    end
  end
end
