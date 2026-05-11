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

        return parent::createApplication();
    }

    private function setEnvironmentValue(string $key, string $value): void
    {
        putenv($key.'='.$value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}