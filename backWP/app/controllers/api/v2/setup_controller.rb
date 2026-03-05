module Api
  module V2
    class SetupController < ApplicationController
      def index
        if installed?
          render json: { status: 'installed', message: 'WordPress is already installed.' }
        else
          render json: { status: 'new', message: 'Ready for installation.' }
        end
      end

      def create
        if installed?
          render json: { error: 'WordPress is already installed.' }, status: :forbidden
          return
        end

        ActiveRecord::Base.transaction do
          # Create Admin User
          user = WpUser.new(
            user_login: params[:username],
            password: params[:password],
            password_confirmation: params[:password],
            email: params[:email],
            user_nicename: params[:username],
            display_name: params[:username]
          )

          if user.save
            # Set Options
            WpOption.create!(option_name: 'siteurl', option_value: params[:url])
            WpOption.create!(option_name: 'home', option_value: params[:url])
            WpOption.create!(option_name: 'blogname', option_value: params[:title])
            WpOption.create!(option_name: 'admin_email', option_value: params[:email])
            
            # Set initial role to administrator
            # Serialized PHP array: a:1:{s:13:"administrator";b:1;}
            user.metas.create!(meta_key: 'wp_capabilities', meta_value: 'a:1:{s:13:"administrator";b:1;}')
            user.metas.create!(meta_key: 'wp_user_level', meta_value: '10')

            render json: { status: 'success', message: 'Installation successful.' }
          else
            render json: { error: user.errors.full_messages }, status: :unprocessable_entity
            raise ActiveRecord::Rollback
          end
        end
      end

      private

      def installed?
        WpUser.exists? && WpOption.where(option_name: 'siteurl').exists?
      end
    end
  end
end
