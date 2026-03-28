module Api
  module V2
    class MenusController < ApplicationController
      before_action :authenticate_user!, only: [:create, :update, :destroy]
      before_action :require_admin, only: [:create, :update, :destroy]
      before_action :set_menu, only: [:show, :update, :destroy]

      # GET /api/v2/menus
      def index
        @menus = WpTermTaxonomy.nav_menus.includes(:term, :posts)

        render json: WpMenuSerializer.new(@menus).serializable_hash
      end

      # GET /api/v2/menus/:id
      def show
        render json: WpMenuSerializer.new(@menu).serializable_hash
      end

      # POST /api/v2/menus
      def create
        term = WpTerm.new(
          name: menu_params[:name] || 'New Menu',
          slug: (menu_params[:slug] || menu_params[:name].to_s.downcase.gsub(/\s+/, '-'))
        )

        unless term.save
          return render json: { error: term.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end

        taxonomy = WpTermTaxonomy.create!(
          term_id: term.term_id,
          taxonomy: 'nav_menu',
          description: menu_params[:description] || '',
          parent: 0,
          count: 0
        )

        render json: WpMenuSerializer.new(taxonomy).serializable_hash, status: :created
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # PATCH/PUT /api/v2/menus/:id
      def update
        if menu_params[:name].present?
          @menu.term.update(name: menu_params[:name])
        end

        if menu_params[:slug].present?
          @menu.term.update(slug: menu_params[:slug])
        end

        @menu.update(description: menu_params[:description]) if menu_params[:description].present?

        render json: WpMenuSerializer.new(@menu).serializable_hash
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # DELETE /api/v2/menus/:id
      def destroy
        # Delete all menu items associated with this menu
        WpTermRelationship.where(term_taxonomy_id: @menu.term_taxonomy_id).each do |rel|
          WpPost.find(rel.object_id).destroy
        end

        # Delete the term and taxonomy
        @menu.destroy

        head :no_content
      end

      private

      def set_menu
        @menu = WpTermTaxonomy.nav_menus.find(params[:id])
      end

      def require_admin
        return if current_user.admin?
        render json: { error: 'Unauthorized' }, status: :forbidden
      end

      def menu_params
        params.require(:menu).permit(:name, :slug, :description)
      end
    end
  end
end
