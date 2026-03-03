class WpTerm < ApplicationRecord
  self.table_name = 'wp_terms'
  self.primary_key = 'term_id'

  has_one :term_taxonomy, class_name: 'WpTermTaxonomy', foreign_key: 'term_id', dependent: :destroy
  has_many :metas, class_name: 'WpTermmeta', foreign_key: 'term_id', dependent: :destroy
  
  validates :name, presence: true, length: { maximum: 200 }
  validates :slug, presence: true, length: { maximum: 200 }
end
