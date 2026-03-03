class Api::V2::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  def create
    build_resource(sign_up_params)

    # Set default WordPress fields
    resource.user_registered = Time.now
    resource.user_activation_key = ''
    resource.user_status = 0
    resource.display_name = resource.user_login

    if resource.save
      # Assign default role (subscriber)
      WpUsermeta.create!(
        user_id: resource.ID,
        meta_key: 'wp_capabilities',
        meta_value: 'a:1:{s:10:"subscriber";b:1;}'
      )
      
      if resource.active_for_authentication?
        sign_up(resource_name, resource)
        token = request.env['warden-jwt_auth.token']
        render json: {
          message: "Signed up successfully.",
          user: WpUserSerializer.new(resource).serializable_hash[:data][:attributes],
          token: token
        }, status: :created
      else
        expire_data_after_sign_in!
        render json: {
          message: "Signed up successfully but account is not active.",
          user: WpUserSerializer.new(resource).serializable_hash[:data][:attributes]
        }, status: :ok
      end
    else
      clean_up_passwords resource
      set_minimum_password_length
      render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def sign_up_params
    params.require(:user).permit(:user_login, :user_email, :user_pass, :user_nicename, :display_name)
  end
end
