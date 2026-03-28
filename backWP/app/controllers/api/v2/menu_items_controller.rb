module Api
  module V2
    class MenuItemsController < ApplicationController
      before_action :authenticate_user!, only: [:create, :update, :destroy]
      before_action :require_admin, only: [:create, :update, :destroy]
      before_action :set_menu
      before_action :set_item, only: [:update, :destroy]

      # POST /api/v2/menus/:menu_id/items
      def create
        service = MenuItemService.new(menu_id: @menu.term_taxonomy_id, params: item_params)
        result = service.create_item

        if result[:success]
          render json: serialize_item(result[:item]), status: :created
        else
          render json: { error: result[:error] }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v2/menus/:menu_id/items/:id
      def update
        service = MenuItemService.new(menu_id: @menu.term_taxonomy_id, params: item_params)
        result = service.update_item(params[:id])

        if result[:success]
          render json: serialize_item(result[:item])
        else
          render json: { error: result[:error] }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v2/menus/:menu_id/items/:id
      def destroy
        service = MenuItemService.new(menu_id: @menu.term_taxonomy_id, params: {})
        result = service.delete_item(params[:id])

        if result[:success]
          head :no_content
        else
          render json: { error: result[:error] }, status: :unprocessable_entity
        end
      end

      private

      def set_menu
        @menu = WpTermTaxonomy.nav_menus.find(params[:menu_id])
      end

      def set_item
        @item = WpPost.nav_menu_items.find(params[:id])
      end

      def require_admin
        return if current_user.admin?
        render json: { error: 'Unauthorized' }, status: :forbidden
      end

      def item_params
        params.require(:item).permit(:label, :url, :type, :object, :object_id, :parent, :menu_order)
      end

      def serialize_item(item)
        {
          id: item.ID,
          label: item.post_title,
          type: item.get_meta('_menu_item_type') || 'custom',
          url: item.get_meta('_menu_item_url') || '#',
          menu_order: item.menu_order,
          object: item.get_meta('_menu_item_object'),
          object_id: item.get_meta('_menu_item_object_id'),
          parent: item.get_meta('_menu_item_menu_item_parent')
        }
      end
    end
  end
end
