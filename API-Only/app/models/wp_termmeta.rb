class WpTermmeta < ApplicationRecord
  self.table_name = 'wp_termmeta'
  self.primary_key = 'meta_id'

  belongs_to :term, class_name: 'WpTerm', foreign_key: 'term_id'

  validates :meta_key, presence: true, length: { maximum: 255 }
end
