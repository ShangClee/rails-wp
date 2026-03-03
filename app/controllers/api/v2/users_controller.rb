module Api
  module V2
    class UsersController < ApplicationController
      before_action :authenticate_user!
      before_action :set_user, only: [:show, :update]

      # GET /api/v2/users
      def index
        unless current_user.admin?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        @users = WpUser.includes(:metas).all
        render json: WpUserSerializer.new(@users).serializable_hash
      end

      # GET /api/v2/users/:id
      def show
        render json: WpUserSerializer.new(@user).serializable_hash
      end

      # GET /api/v2/users/me
      def me
        render json: WpUserSerializer.new(current_user).serializable_hash
      end

      # PATCH /api/v2/users/:id
      def update
        unless can_edit_user?
          return render json: { error: 'Unauthorized' }, status: :forbidden
        end

        if @user.update(user_params)
          render json: WpUserSerializer.new(@user).serializable_hash
        else
          render json: { errors: @user.errors }, status: :unprocessable_entity
        end
      end

      private

      def set_user
        @user = WpUser.find(params[:id])
      end

      def user_params
        params.require(:user).permit(:user_email, :display_name, :user_url)
      end

      def can_edit_user?
        return true if current_user.admin?
        return true if current_user.ID == @user.ID
        false
      end
    end
  end
end
