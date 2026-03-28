module Api
  module V2
    class TagsController < ApplicationController
      before_action :authenticate_user!, only: [:create, :update, :destroy]
      before_action :set_tag, only: [:show, :update, :destroy]

      # GET /api/v2/tags
      def index
        page = [params[:page].to_i, 1].max
        per_page = params[:per_page].to_i
        per_page = 20 if per_page <= 0

        @tags = WpTermTaxonomy.tags
                              .includes(:term)
                              .offset((page - 1) * per_page)
                              .limit(per_page)

        render json: WpTermTaxonomySerializer.new(@tags).serializable_hash
      end

      # GET /api/v2/tags/:id
      def show
        render json: WpTermTaxonomySerializer.new(@tag).serializable_hash
      end

      # POST /api/v2/tags
      def create
        unless can_create_tag?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        result = create_taxonomy('post_tag', tag_params)

        if result[:success]
          render json: WpTermTaxonomySerializer.new(result[:taxonomy]).serializable_hash, status: :created
        else
          render json: { error: result[:error] }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v2/tags/:id
      def update
        unless can_update_tag?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        if @tag.update(tag_params)
          @tag.term.update(name: tag_params[:name], slug: tag_params[:slug]) if tag_params[:name] || tag_params[:slug]
          render json: WpTermTaxonomySerializer.new(@tag).serializable_hash
        else
          render json: { errors: @tag.errors }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v2/tags/:id
      def destroy
        unless can_delete_tag?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        @tag.destroy
        head :no_content
      end

      private

      def set_tag
        @tag = WpTermTaxonomy.tags.find(params[:id])
      end

      def can_create_tag?
        current_user && (current_user.admin? || current_user.editor? || current_user.author?)
      end

      def can_update_tag?
        current_user && (current_user.admin? || current_user.editor? || current_user.author?)
      end

      def can_delete_tag?
        current_user && (current_user.admin? || current_user.editor?)
      end

      def tag_params
        params.require(:tag).permit(:name, :slug, :description)
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
          parent: 0,
          count: 0
        )

        { success: true, taxonomy: taxonomy }
      rescue => e
        { success: false, error: e.message }
      end
    end
  end
end
