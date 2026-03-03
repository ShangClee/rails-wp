class WpTermRelationship < ApplicationRecord
  self.table_name = 'wp_term_relationships'
  self.primary_key = [:object_id, :term_taxonomy_id]

  belongs_to :term_taxonomy, class_name: 'WpTermTaxonomy', foreign_key: 'term_taxonomy_id'
  belongs_to :post, class_name: 'WpPost', foreign_key: 'object_id'
end
