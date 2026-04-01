module Api
  module V2
    class UsersController < ApplicationController
      before_action :authenticate_user!
      before_action :set_user, only: [ :show, :update, :role ]

      # GET /api/v2/users
      def index
        unless current_user.admin?
          return render json: {
            code: "rest_forbidden",
            message: "Sorry, you are not allowed to list users.",
            data: { status: 401 }
          }, status: :unauthorized
        end

        query = WpUser.includes(:metas)

        # Filter by role if specified
        if params[:role].present?
          query = query.where(role: params[:role])
        end

        # Search functionality
        if params[:search].present?
          search_term = "%#{params[:search]}%"
          query = query.where("display_name LIKE ? OR user_email LIKE ? OR user_login LIKE ?",
                             search_term, search_term, search_term)
        end

        page = [ params[:page].to_i, 1 ].max
        per_page = params[:per_page].to_i
        per_page = 10 if per_page <= 0

        @users = query.offset((page - 1) * per_page).limit(per_page)

        # Add WordPress-compatible headers
        total_users = query.count
        response.headers["X-WP-Total"] = total_users.to_s
        response.headers["X-WP-TotalPages"] = ((total_users.to_f / per_page).ceil).to_s

        collection_info = {
          params: params.merge(page: [ params[:page].to_i, 1 ].max, per_page: per_page),
          total_count: total_users
        }

        render json: WpUserSerializer.new(@users, collection_info: collection_info).serializable_hash
      end

      # GET /api/v2/users/:id
      def show
        json = Rails.cache.fetch("users/#{@user.id}", expires_in: 12.hours) do
          WpUserSerializer.new(@user).serializable_hash.to_json
        end
        render json: json
      end

      # GET /api/v2/users/me
      def me
        json = Rails.cache.fetch("users/me/#{current_user.id}", expires_in: 12.hours) do
          WpUserSerializer.new(current_user).serializable_hash.to_json
        end
        render json: json
      end

      # PATCH /api/v2/users/:id
      def update
        unless can_edit_user?
          return render json: {
            code: "rest_forbidden",
            message: "Sorry, you are not allowed to edit this user.",
            data: { status: 401 }
          }, status: :unauthorized
        end

        if @user.update(user_params)
          render json: WpUserSerializer.new(@user).serializable_hash
        else
          render json: {
            code: "rest_invalid_params",
            message: "Invalid user data.",
            data: { status: 400, details: @user.errors.messages }
          }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v2/users/:id/role
      def role
        unless current_user.admin?
          return render json: {
            code: "rest_forbidden",
            message: "Sorry, you are not allowed to edit user roles.",
            data: { status: 401 }
          }, status: :unauthorized
        end

        service = UserRoleService.new(user: @user, role: role_params[:role])
        result = service.assign_role

        if result[:success]
          render json: WpUserSerializer.new(result[:user]).serializable_hash
        else
          render json: {
            code: "rest_invalid_params",
            message: result[:error],
            data: { status: 400 }
          }, status: :bad_request
        end
      end

      private

      def set_user
        @user = WpUser.find(params[:id])
      end

      def user_params
        params.require(:user).permit(:user_email, :display_name, :user_url)
      end

      def role_params
        params.require(:user).permit(:role)
      end

      def can_edit_user?
        return true if current_user.admin?
        return true if current_user.ID == @user.ID
        false
      end
    end
  end
end
