module CompanyApi

  module Request

    class Token < CompanyApi::Request::Base

      # Initialize
      #
      # * Author: Ankit
      # * Date: 03/01/2019
      # * Reviewed By: Kedar
      #
      # @param [Klass] api_response_formatter_class (mandatory) - Api response formatter_class for api Response
      # @param [Hash] cookies (mandatory) - cookies that need to be sent to API
      # @param [Hash] headers (optional) - headers that need to be sent to API
      #
      # @return [CompanyApi::Request::Token] returns an object of CompanyApi::Request::Token class
      #
      def initialize(api_response_formatter_class, cookies, headers = {})

        super(api_response_formatter_class, cookies, true, headers)
        @service_base_route = 'token/'

      end

      # Fetch token details before setup
      # NOTE: This would return default price points
      # (after setup starts we should ONLY use price points for the chain token has been associated with)
      #
      # * Author: Puneet
      # * Date: 08/12/2018
      # * Reviewed By: Sunil
      #
      def fetch_token_details_before_setup
        get('')
      end

      # Get deploy token details
      #
      # * Author: Puneet
      # * Date: 08/12/2018
      # * Reviewed By: Sunil
      #
      def token_deploy
        get('deploy', {})
      end

      # Get token dashboard details
      #
      # * Author: Dhananjay
      # * Date: 02/04/2019
      # * Reviewed By: Sunil
      #
      def dashboard
        get('dashboard', {})
      end
    end

  end

end
