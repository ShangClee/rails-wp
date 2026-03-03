module Api
  module V2
    class TaxonomiesController < ApplicationController
      before_action :authenticate_user!, only: [:create, :update, :destroy]
      before_action :set_taxonomy, only: [:show, :update, :destroy]

      # GET /api/v2/taxonomies
      def index
        @taxonomies = WpTermTaxonomy.includes(:term).all
        
        if params[:type].present?
          @taxonomies = @taxonomies.where(taxonomy: params[:type])
        end

        render json: WpTermTaxonomySerializer.new(@taxonomies).serializable_hash
      end

      # GET /api/v2/taxonomies/:id
      def show
        render json: WpTermTaxonomySerializer.new(@taxonomy).serializable_hash
      end

      # POST /api/v2/taxonomies
      def create
        unless current_user.admin? || current_user.editor?
          return render json: { error: 'Unauthorized' }, status: :forbidden
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
            description: taxonomy_params[:description] || '',
            parent: taxonomy_params[:parent] || 0,
            count: 0
          )
        end

        render json: WpTermTaxonomySerializer.new(@taxonomy).serializable_hash, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # PATCH /api/v2/taxonomies/:id
      def update
        unless current_user.admin? || current_user.editor?
          return render json: { error: 'Unauthorized' }, status: :forbidden
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
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # DELETE /api/v2/taxonomies/:id
      def destroy
        unless current_user.admin? || current_user.editor?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        @taxonomy.term.destroy # Will destroy taxonomy via dependent: :destroy
        head :no_content
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
