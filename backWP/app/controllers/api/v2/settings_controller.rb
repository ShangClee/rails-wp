module Api
  module V2
    class SettingsController < ApplicationController
      before_action :authenticate_user!
      before_action :require_admin

      # GET /api/v2/settings
      def show
        settings = SettingsUtility.fetch_all
        render json: { data: settings }
      end

      # PATCH /api/v2/settings
      def update
        SettingsUtility.update_all(settings_params)
        settings = SettingsUtility.fetch_all
        render json: { data: settings }
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def require_admin
        return if current_user.admin?
        render json: { error: 'Unauthorized' }, status: :forbidden
      end

      def settings_params
        params.require(:settings).permit(SettingsUtility::ALLOWED_KEYS)
      end
    end
  end
end
