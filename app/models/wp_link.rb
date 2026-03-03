class WpLink < ApplicationRecord
  self.table_name = 'wp_links'
  self.primary_key = 'link_id'

  validates :link_url, presence: true, length: { maximum: 255 }
  validates :link_name, presence: true, length: { maximum: 255 }
  
  scope :visible, -> { where(link_visible: 'Y') }
end
