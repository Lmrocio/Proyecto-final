<?php

namespace Tests;

use PDO;

abstract class DatabaseTestCase extends TestCase
{
    protected function setUp(): void
    {
        if (! in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The sqlite PDO driver is not available in this PHP runtime.');
        }

        parent::setUp();
    }

    public function createApplication()
    {
        $databasePath = dirname(__DIR__).'/database/testing.sqlite';

        if (! file_exists($databasePath)) {
            touch($databasePath);
        }

        $this->setEnvironmentValue('APP_ENV', 'testing');
        $this->setEnvironmentValue('DB_CONNECTION', 'sqlite');
        $this->setEnvironmentValue('DB_DATABASE', $databasePath);
        $this->setEnvironmentValue('CACHE_STORE', 'array');
        $this->setEnvironmentValue('SESSION_DRIVER', 'array');
        $this->setEnvironmentValue('QUEUE_CONNECTION', 'sync');
        $this->setEnvironmentValue('MAIL_MAILER', 'array');

        // Safety: never let the sqlite test connection inherit a remote DB_URL.
        // The 'sqlite' connection in config/database.php defines 'url' => env('DB_URL'),
        // and a populated DB_URL (e.g. a managed Postgres instance) would override the
        // driver/host, pointing tests at a real database. RefreshDatabase would then run
        // migrate:fresh against it and wipe production data.
        $this->unsetEnvironmentValue('DB_URL');
        $this->unsetEnvironmentValue('DATABASE_URL');

        $app = parent::createApplication();

        // The framework reloads .env during bootstrap, which can repopulate DB_URL.
        // Force the sqlite connection back to the local in-process database and drop
        // any inherited URL so the test connection can never reach a remote server.
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.url', null);
        $app['config']->set('database.connections.sqlite.database', $databasePath);
        $app['db']->purge('sqlite');

        return $app;
    }

    private function setEnvironmentValue(string $key, string $value): void
    {
        putenv($key.'='.$value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }

    private function unsetEnvironmentValue(string $key): void
    {
        putenv($key);
        unset($_ENV[$key], $_SERVER[$key]);
    }
}