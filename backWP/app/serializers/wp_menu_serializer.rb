class WpMenuSerializer
  include JSONAPI::Serializer

  set_id :term_taxonomy_id
  set_type :menu

  attributes :taxonomy, :description

  attribute :name do |object|
    object.term.name
  end

  attribute :slug do |object|
    object.term.slug
  end

  attribute :parent_id do |object|
    object.parent
  end

  attribute :count do |object|
    object.count
  end

  attribute :items do |object|
    # Get all nav_menu_items for this menu, ordered by menu_order
    object.posts
          .includes(:metas)
          .order('wp_term_relationships.term_order ASC')
          .map do |item|
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
