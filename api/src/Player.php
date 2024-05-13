<?php

namespace Api\WebSocket;

use Exception;
use Ratchet\ConnectionInterface;
use Ratchet\WebSocket\MessageComponentInterface;




class Player implements MessageComponentInterface
{
    protected $jogador;

    private $players = [];

    public function __construct()
    {
        $this->jogador = new \SplObjectStorage;
    }

    public function onOpen(ConnectionInterface $conn)
    {
        $this->jogador->attach($conn);

        echo "Nova conexao: {$conn->resourceId}\n\n";
        $this->players[] = $conn->resourceId;

        // Convertendo o array $players em uma string
        $playersString = implode(", ", $this->players);

        // Imprimindo as conexões
        echo "Connections: $playersString\n\n";
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        foreach ($this->jogador as $jogador) {
            if ($from !== $jogador) {
                $jogador->send($msg);
            }
        }

        echo "Jogador {$from->resourceId} enviu uma mensagem \n\n";
    }

    public function onClose(ConnectionInterface $conn)
    {
        $this->jogador->detach($conn);

        echo "Jogador {$conn->resourceId} desconectou\n\n";

        // Encontrar o índice do jogador no array $players
        $index = array_search($conn->resourceId, $this->players);

        // Se o jogador for encontrado no array, removê-lo
        if ($index !== false) {
            unset($this->players[$index]);
        }
        // Convertendo o array $players em uma string
        $playersString = implode(", ", $this->players);

        // Imprimindo as conexões
        echo "Connections: $playersString\n\n";
    }

    public function onError(ConnectionInterface $conn, Exception $e)
    {
        $conn->close();

        echo "Ocorreu um erro: {$e->getMessage()} \n\n";
    }
}
