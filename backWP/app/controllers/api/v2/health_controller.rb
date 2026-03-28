module Api
  module V2
    class HealthController < ApplicationController
      before_action :authenticate_user!, only: [:show]

      # GET /api/v2/health
      def show
        begin
          # Test database connection
          db_status = WpPost.count >= 0 ? 'connected' : 'error'
        rescue => e
          db_status = 'error'
          db_error = e.message
        end

        begin
          # Test Redis connection
          redis = Redis.new(url: ENV['REDIS_URL'] || 'redis://localhost:6379/1')
          redis.ping
          redis_status = 'connected'
        rescue => e
          redis_status = 'error'
          redis_error = e.message
        end

        health_data = {
          status: 'ok',
          database: {
            status: db_status,
            error: db_error
          },
          redis: {
            status: redis_status,
            error: redis_error
          },
          content_stats: {
            posts: WpPost.posts.count,
            pages: WpPost.pages.count,
            media: WpPost.where(post_type: 'attachment').count,
            users: WpUser.count,
            comments: WpComment.count
          },
          timestamp: Time.current.iso8601
        }

        render json: health_data
      end
    end
  end
end
