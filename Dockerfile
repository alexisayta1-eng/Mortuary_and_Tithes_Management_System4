FROM php:8.2-apache

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache modules (rewrite, headers, mime)
RUN a2enmod rewrite headers mime

# Copy project files to Apache web directory
COPY . /var/www/html/

# Ensure correct permissions
RUN chown -R www-data:www-data /var/www/html

# Expose HTTP port
EXPOSE 80 10000

# Start script to dynamically bind to Render's $PORT at container runtime
CMD ["sh", "-c", "sed -i \"s/Listen 80/Listen ${PORT:-80}/g\" /etc/apache2/ports.conf && sed -i \"s/:80/:${PORT:-80}/g\" /etc/apache2/sites-available/000-default.conf && apache2-foreground"]

