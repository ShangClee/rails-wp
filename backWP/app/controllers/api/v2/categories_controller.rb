module Api
  module V2
    class CategoriesController < ApplicationController
      before_action :authenticate_user!, only: [:create, :update, :destroy]
      before_action :set_category, only: [:show, :update, :destroy]

      # GET /api/v2/categories
      def index
        page = [params[:page].to_i, 1].max
        per_page = params[:per_page].to_i
        per_page = 20 if per_page <= 0

        @categories = WpTermTaxonomy.categories
                                    .includes(:term)
                                    .offset((page - 1) * per_page)
                                    .limit(per_page)

        render json: WpTermTaxonomySerializer.new(@categories).serializable_hash
      end

      # GET /api/v2/categories/:id
      def show
        render json: WpTermTaxonomySerializer.new(@category).serializable_hash
      end

      # POST /api/v2/categories
      def create
        unless can_create_category?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        result = create_taxonomy('category', category_params)

        if result[:success]
          render json: WpTermTaxonomySerializer.new(result[:taxonomy]).serializable_hash, status: :created
        else
          render json: { error: result[:error] }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v2/categories/:id
      def update
        unless can_update_category?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        if @category.update(category_params)
          @category.term.update(name: category_params[:name], slug: category_params[:slug]) if category_params[:name] || category_params[:slug]
          render json: WpTermTaxonomySerializer.new(@category).serializable_hash
        else
          render json: { errors: @category.errors }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v2/categories/:id
      def destroy
        unless can_delete_category?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        @category.destroy
        head :no_content
      end

      private

      def set_category
        @category = WpTermTaxonomy.categories.find(params[:id])
      end

      def can_create_category?
        current_user && (current_user.admin? || current_user.editor?)
      end

      def can_update_category?
        current_user && (current_user.admin? || current_user.editor?)
      end

      def can_delete_category?
        current_user && current_user.admin?
      end

      def category_params
        params.require(:category).permit(:name, :slug, :description, :parent)
      end

      def create_taxonomy(taxonomy_type, params)
        term = WpTerm.new(name: params[:name], slug: params[:slug])

        unless term.save
          return { success: false, error: term.errors.full_messages.join(', ') }
        end

        taxonomy = WpTermTaxonomy.create(
          term_id: term.term_id,
          taxonomy: taxonomy_type,
          description: params[:description] || '',
          parent: params[:parent] || 0,
          count: 0
        )

        { success: true, taxonomy: taxonomy }
      rescue => e
        { success: false, error: e.message }
      end
    end
  end
end
