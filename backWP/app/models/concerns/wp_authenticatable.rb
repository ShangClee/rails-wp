# app/models/concerns/wp_authenticatable.rb
module WpAuthenticatable
  extend ActiveSupport::Concern

  included do
    def role
      capabilities = get_meta('wp_capabilities')
      return nil unless capabilities
      
      # Parse PHP serialized data (simplified for now, ideally use a PHP serializer gem)
      # Basic regex to find the role key
      if capabilities.include?('"administrator"')
        :administrator
      elsif capabilities.include?('"editor"')
        :editor
      elsif capabilities.include?('"author"')
        :author
      elsif capabilities.include?('"contributor"')
        :contributor
      elsif capabilities.include?('"subscriber"')
        :subscriber
      else
        :subscriber
      end
    end

    def admin?
      role == :administrator
    end

    def editor?
      role == :editor
    end

    def author?
      role == :author
    end

    def contributor?
      role == :contributor
    end

    def subscriber?
      role == :subscriber
    end
  end
end
