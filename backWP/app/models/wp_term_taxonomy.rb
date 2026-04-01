class WpTermTaxonomy < ApplicationRecord
  self.table_name = 'wp_term_taxonomy'
  self.primary_key = 'term_taxonomy_id'

  belongs_to :term, class_name: 'WpTerm', foreign_key: 'term_id'
  has_many :term_relationships, class_name: 'WpTermRelationship', foreign_key: 'term_taxonomy_id', dependent: :destroy
  has_many :posts, through: :term_relationships, source: :post

  # Hierarchy
  belongs_to :parent_taxonomy, class_name: 'WpTermTaxonomy', foreign_key: 'parent', optional: true
  has_many :children, class_name: 'WpTermTaxonomy', foreign_key: 'parent'

  validates :taxonomy, presence: true, length: { maximum: 32 }
  
  scope :categories, -> { where(taxonomy: 'category') }
  scope :tags, -> { where(taxonomy: 'post_tag') }
  scope :nav_menus, -> { where(taxonomy: 'nav_menu') }
  scope :post_formats, -> { where(taxonomy: 'post_format') }
end
