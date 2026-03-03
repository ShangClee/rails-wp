class WpOption < ApplicationRecord
  self.table_name = 'wp_options'
  self.primary_key = 'option_id'

  validates :option_name, presence: true, uniqueness: true, length: { maximum: 191 }
  
  # Helper to fetch option value by name
  def self.get(name)
    find_by(option_name: name)&.option_value
  end
end
