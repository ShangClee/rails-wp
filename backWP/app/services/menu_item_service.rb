class MenuItemService
  def initialize(menu_id:, params:)
    @menu_id = menu_id  # This is the term_taxonomy_id
    @params = params
  end

  def create_item
    ActiveRecord::Base.transaction do
      # Create the nav_menu_item post
      item = WpPost.new(
        post_title: @params[:label] || 'Menu Item',
        post_type: 'nav_menu_item',
        post_status: 'publish',
        menu_order: @params[:menu_order] || 0,
        post_parent: 0
      )

      unless item.save
        return { success: false, error: item.errors.full_messages.join(', ') }
      end

      # Create the term relationship to link item to menu
      WpTermRelationship.create!(
        object_id: item.ID,
        term_taxonomy_id: @menu_id,
        term_order: @params[:menu_order] || 0
      )

      # Create postmeta for menu item attributes
      item_meta = {
        '_menu_item_type' => @params[:type] || 'custom',
        '_menu_item_url' => @params[:url] || '#',
        '_menu_item_object' => @params[:object] || '',
        '_menu_item_object_id' => @params[:object_id] || '0',
        '_menu_item_menu_item_parent' => @params[:parent] || '0',
        '_menu_item_classes' => @params[:classes] || ''
      }

      item_meta.each do |key, value|
        WpPostmeta.create!(post_id: item.ID, meta_key: key, meta_value: value)
      end

      { success: true, item: item }
    end
  rescue => e
    { success: false, error: e.message }
  end

  def update_item(item_id)
    ActiveRecord::Base.transaction do
      item = WpPost.nav_menu_items.find(item_id)

      item.update!(
        post_title: @params[:label] || item.post_title,
        menu_order: @params[:menu_order] || item.menu_order
      )

      # Update term relationship order
      relationship = WpTermRelationship.find_by(object_id: item_id, term_taxonomy_id: @menu_id)
      relationship.update!(term_order: @params[:menu_order]) if relationship

      # Update postmeta if provided
      if @params[:url].present?
        meta = item.metas.find_or_initialize_by(meta_key: '_menu_item_url')
        meta.meta_value = @params[:url]
        meta.save!
      end

      if @params[:type].present?
        meta = item.metas.find_or_initialize_by(meta_key: '_menu_item_type')
        meta.meta_value = @params[:type]
        meta.save!
      end

      { success: true, item: item }
    end
  rescue => e
    { success: false, error: e.message }
  end

  def delete_item(item_id)
    ActiveRecord::Base.transaction do
      item = WpPost.nav_menu_items.find(item_id)

      # Delete term relationships
      WpTermRelationship.where(object_id: item_id).destroy_all

      # Delete the post (postmeta will be deleted via dependent: :destroy)
      item.destroy!

      { success: true }
    end
  rescue => e
    { success: false, error: e.message }
  end
end
