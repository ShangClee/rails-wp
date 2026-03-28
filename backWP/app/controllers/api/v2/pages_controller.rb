module Api
  module V2
    class PagesController < ApplicationController
      before_action :authenticate_user!, only: [:create, :update, :destroy]
      before_action :set_page, only: [:show, :update, :destroy]

      # GET /api/v2/pages
      def index
        page = [params[:page].to_i, 1].max
        per_page = params[:per_page].to_i
        per_page = 10 if per_page <= 0

        @pages = Rails.cache.fetch("pages/page/#{page}/per_page/#{per_page}", expires_in: 12.hours) do
          offset = (page - 1) * per_page
          WpPost.published.pages.includes(:author, :metas, term_taxonomies: :term).recent
            .offset(offset).limit(per_page).to_a
        end

        render json: WpPostSerializer.new(@pages).serializable_hash
      end

      # GET /api/v2/pages/:id
      def show
        json = Rails.cache.fetch("pages/#{@page.id}", expires_in: 12.hours) do
          WpPostSerializer.new(@page).serializable_hash.to_json
        end
        render json: json
      end

      # POST /api/v2/pages
      def create
        unless current_user.admin? || current_user.editor? || current_user.author?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        @page = WpPost.new(page_params)
        @page.post_author = current_user.ID
        @page.post_date = Time.now
        @page.post_date_gmt = Time.now.utc
        @page.post_modified = Time.now
        @page.post_modified_gmt = Time.now.utc
        @page.post_type = 'page'
        @page.comment_status = 'open'
        @page.ping_status = 'open'
        @page.to_ping = ''
        @page.pinged = ''
        @page.post_content_filtered = ''

        if @page.save
          render json: WpPostSerializer.new(@page).serializable_hash, status: :created
        else
          render json: { errors: @page.errors }, status: :unprocessable_entity
        end
      end

      # PUT/PATCH /api/v2/pages/:id
      def update
        unless can_edit_page?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        @page.post_modified = Time.now
        @page.post_modified_gmt = Time.now.utc

        if @page.update(page_params)
          render json: WpPostSerializer.new(@page).serializable_hash
        else
          render json: { errors: @page.errors }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v2/pages/:id
      def destroy
        unless can_delete_page?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        @page.destroy
        head :no_content
      end

      private

      def set_page
        @page = WpPost.find(params[:id])
      end

      def page_params
        params.require(:page).permit(:post_title, :post_content, :post_excerpt, :post_status, :post_name, :post_parent)
      end

      def can_edit_page?
        return true if current_user.admin? || current_user.editor?
        return true if current_user.author? && @page.post_author == current_user.ID
        false
      end

      def can_delete_page?
        can_edit_page?
      end
    end
  end
end
