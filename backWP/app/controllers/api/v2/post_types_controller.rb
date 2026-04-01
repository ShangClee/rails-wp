module Api
  module V2
    class PostTypesController < ApplicationController
      BUILT_IN_TYPES = {
        "post" => { label: "Posts", public: true, hierarchical: false, supports: %w[title editor author thumbnail excerpt trackbacks custom-fields comments revisions post-formats] },
        "page" => { label: "Pages", public: true, hierarchical: true, supports: %w[title editor author thumbnail page-attributes custom-fields comments revisions] },
        "attachment" => { label: "Media", public: true, hierarchical: false, supports: %w[title author comments] },
        "revision" => { label: "Revisions", public: false, hierarchical: false, supports: [] },
        "nav_menu_item" => { label: "Navigation Menu Items", public: false, hierarchical: false, supports: [] }
      }.freeze

      # GET /api/v2/types
      def index
        # Discover any additional post types stored in the database
        db_types = WpPost.distinct.pluck(:post_type) - BUILT_IN_TYPES.keys
        custom_types = db_types.each_with_object({}) do |type, hash|
          hash[type] = { label: type.humanize, public: true, hierarchical: false, supports: %w[title editor] }
        end

        all_types = BUILT_IN_TYPES.merge(custom_types)
        render json: all_types
      end
    end
  end
end
