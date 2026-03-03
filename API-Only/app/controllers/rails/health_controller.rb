class Rails::HealthController < ActionController::API
  def show
    # Check Database connection
    ActiveRecord::Base.connection.execute("SELECT 1")
    
    # Check Redis connection
    Rails.cache.read("health_check")

    render json: { status: "up", timestamp: Time.now.iso8601 }, status: :ok
  rescue StandardError => e
    render json: { status: "down", error: e.message }, status: :service_unavailable
  end
end
