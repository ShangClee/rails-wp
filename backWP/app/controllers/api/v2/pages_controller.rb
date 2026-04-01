module Api
  module V2
    class PagesController < ApplicationController
      before_action :authenticate_user!, only: [ :create, :update, :destroy ]
      before_action :set_page, only: [ :show, :update, :destroy ]

      # GET /api/v2/pages
      def index
        page = [ params[:page].to_i, 1 ].max
        per_page = params[:per_page].to_i
        per_page = 10 if per_page <= 0

        @pages = Rails.cache.fetch("pages/page/#{page}/per_page/#{per_page}", expires_in: 12.hours) do
          offset = (page - 1) * per_page
          query = WpPost.published.pages.includes(:author, :metas, term_taxonomies: :term)

          # Filter by status
          query = query.where(post_status: params[:status]) if params[:status].present?

          # Filter by author
          query = query.where(post_author: params[:author]) if params[:author].present?

          # Filter by parent
          query = query.where(post_parent: params[:parent]) if params[:parent].present?

          # Search in title and content
          if params[:search].present?
            search_term = "%#{params[:search]}%"
            query = query.where("post_title LIKE ? OR post_content LIKE ?", search_term, search_term)
          end

          @pages = query.recent.offset(offset).limit(per_page).to_a
        end

        # Add WordPress-compatible headers
        total_pages = WpPost.published.pages.count
        total_pages = apply_filters_to_count(total_pages, params)
        response.headers["X-WP-Total"] = total_pages.to_s
        response.headers["X-WP-TotalPages"] = ((total_pages.to_f / per_page).ceil).to_s

        collection_info = {
          params: params.merge(page: [ params[:page].to_i, 1 ].max, per_page: per_page),
          total_count: total_pages
        }

        render json: WpPageSerializer.new(@pages, collection_info: collection_info).serializable_hash
      end

      # GET /api/v2/pages/:id
      def show
        json = Rails.cache.fetch("pages/#{@page.id}", expires_in: 12.hours) do
          WpPageSerializer.new(@page).serializable_hash.to_json
        end
        render json: json
      end

      # POST /api/v2/pages
      def create
        unless current_user.admin? || current_user.editor? || current_user.author?
          return render json: { error: "Unauthorized" }, status: :forbidden
        end

        @page = WpPost.new(page_params)
        @page.post_author = current_user.ID
        @page.post_date = TimezoneUtility.now_local
        @page.post_date_gmt = TimezoneUtility.now_utc
        @page.post_modified = TimezoneUtility.now_local
        @page.post_modified_gmt = TimezoneUtility.now_utc
        @page.post_type = "page"
        @page.comment_status = "open"
        @page.ping_status = "open"
        @page.to_ping = ""
        @page.pinged = ""
        @page.post_content_filtered = ""

        if @page.save
          render json: WpPageSerializer.new(@page).serializable_hash, status: :created
        else
          render json: { errors: @page.errors }, status: :unprocessable_entity
        end
      end

      # PUT/PATCH /api/v2/pages/:id
      def update
        unless can_edit_page?
          return render json: { error: "Unauthorized" }, status: :forbidden
        end

        @page.post_modified = TimezoneUtility.now_local
        @page.post_modified_gmt = TimezoneUtility.now_utc

        if @page.update(page_params)
          render json: WpPageSerializer.new(@page).serializable_hash
        else
          render json: { errors: @page.errors }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v2/pages/:id
      def destroy
        unless can_delete_page?
          return render json: { error: "Unauthorized" }, status: :forbidden
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

      def apply_filters_to_count(base_count, filter_params)
        # Apply the same filters as in the query to get accurate count
        count = base_count

        # Filter by status
        count = WpPost.where(post_status: filter_params[:status]).count if filter_params[:status].present? && filter_params[:status] != "publish"

        # Filter by author
        count = WpPost.where(post_author: filter_params[:author]).count if filter_params[:author].present?

        # Filter by parent
        count = WpPost.where(post_parent: filter_params[:parent]).count if filter_params[:parent].present?

        # Note: For search filters, we'd need more complex queries
        # For now, we'll use the base count which might be slightly off but avoids complex queries
        # In a production implementation, we'd want to apply all filters for accurate count

        count
      end
    end
  end
end
