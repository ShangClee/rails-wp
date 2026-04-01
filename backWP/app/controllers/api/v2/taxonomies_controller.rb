module Api
  module V2
    class TaxonomiesController < ApplicationController
      before_action :authenticate_user!, only: [ :create, :update, :destroy ]
      before_action :set_taxonomy, only: [ :show, :update, :destroy ]

      # GET /api/v2/taxonomies
      def index
        query = WpTermTaxonomy.includes(:term)

        if params[:type].present?
          query = query.where(taxonomy: params[:type])
        end

        # Filter by search
        if params[:search].present?
          search_term = "%#{params[:search]}%"
          query = query.joins(:term).where("wp_terms.name LIKE ? OR wp_terms.slug LIKE ?", search_term, search_term)
        end

        page = [ params[:page].to_i, 1 ].max
        per_page = params[:per_page].to_i
        per_page = 10 if per_page <= 0

        @taxonomies = query.offset((page - 1) * per_page).limit(per_page)

        # Add WordPress-compatible headers
        total_taxonomies = query.count
        response.headers["X-WP-Total"] = total_taxonomies.to_s
        response.headers["X-WP-TotalPages"] = ((total_taxonomies.to_f / per_page).ceil).to_s

        collection_info = {
          params: params.merge(page: [ params[:page].to_i, 1 ].max, per_page: per_page),
          total_count: total_taxonomies
        }

        render json: WpTermTaxonomySerializer.new(@taxonomies, collection_info: collection_info).serializable_hash
      end

      # GET /api/v2/taxonomies/:id
      def show
        json = Rails.cache.fetch("taxonomies/#{@taxonomy.id}", expires_in: 12.hours) do
          WpTermTaxonomySerializer.new(@taxonomy).serializable_hash.to_json
        end
        render json: json
      end

      # POST /api/v2/taxonomies
      def create
        unless current_user.admin? || current_user.editor?
          return render json: {
            code: "rest_forbidden",
            message: "Sorry, you are not allowed to create taxonomies.",
            data: { status: 401 }
          }, status: :unauthorized
        end

        # Need to create Term first, then Taxonomy
        ActiveRecord::Base.transaction do
          @term = WpTerm.create!(
            name: taxonomy_params[:name],
            slug: taxonomy_params[:slug] || taxonomy_params[:name].parameterize,
            term_group: 0
          )

          @taxonomy = WpTermTaxonomy.create!(
            term_id: @term.term_id,
            taxonomy: taxonomy_params[:taxonomy],
            description: taxonomy_params[:description] || "",
            parent: taxonomy_params[:parent] || 0,
            count: 0
          )
        end

        render json: WpTermTaxonomySerializer.new(@taxonomy).serializable_hash, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          code: "rest_invalid_params",
          message: e.message,
          data: { status: 400 }
        }, status: :bad_request
      end

      # PATCH /api/v2/taxonomies/:id
      def update
        unless current_user.admin? || current_user.editor?
          return render json: {
            code: "rest_forbidden",
            message: "Sorry, you are not allowed to edit taxonomies.",
            data: { status: 401 }
          }, status: :unauthorized
        end

        ActiveRecord::Base.transaction do
          @taxonomy.term.update!(
            name: taxonomy_params[:name],
            slug: taxonomy_params[:slug]
          ) if taxonomy_params[:name] || taxonomy_params[:slug]

          @taxonomy.update!(
            description: taxonomy_params[:description],
            parent: taxonomy_params[:parent]
          )
        end

        render json: WpTermTaxonomySerializer.new(@taxonomy).serializable_hash
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          code: "rest_invalid_params",
          message: e.message,
          data: { status: 400 }
        }, status: :bad_request
      end

      # DELETE /api/v2/taxonomies/:id
      def destroy
        unless current_user.admin? || current_user.editor?
          return render json: {
            code: "rest_forbidden",
            message: "Sorry, you are not allowed to delete taxonomies.",
            data: { status: 401 }
          }, status: :unauthorized
        end

        if @taxonomy.term.destroy # Will destroy taxonomy via dependent: :destroy
          head :no_content
        else
          render json: {
            code: "rest_term_cannot_delete",
            message: "Failed to delete taxonomy.",
            data: { status: 500 }
          }, status: :internal_server_error
        end
      end

      # GET /api/v2/taxonomies/post_formats
      def post_formats
        formats = %w[standard aside image video quote link gallery status audio chat]
        render json: { post_formats: formats }
      end

      private

      def set_taxonomy
        @taxonomy = WpTermTaxonomy.find(params[:id])
      end

      def taxonomy_params
        params.require(:taxonomy).permit(:name, :slug, :taxonomy, :description, :parent)
      end
    end
  end
end
