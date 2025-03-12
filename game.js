// Configuración del juego
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth - 5,      // Ancho de la pantalla menos 100 píxeles
    height: window.innerHeight - 100,     // Alto de la pantalla menos 100 píxeles
    parent: 'game-container',  // Agrega esta línea
    scene: {
        key: "mainScene",   // Nombre de la escena
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

// Variables globales
let game, player, cursors, spacebar, bullets, invaders;

let bulletsFired = 0;
let bulletTime = 0;
let invaderSpeed = 200;            // Velocidad horizontal de los invasores
let invaderDirection = 1;      // 1 = derecha, -1 = izquierda
let invaderRowHeight = 50;     // Cuánto bajan cuando tocan un borde
let movingDown = false;        // Control para evitar bajadas continuas
let invaderCount = 5;          // 5 invasores por fila
let invaderSpacing = 100;      // Espacio fijo entre invasores (en píxeles)
let leftMargin = 50;           // El primer invasor empieza en x = 50
let invaderY = 50;             // Posición Y inicial de la fila de invasores

let score = 0;


function preload() {
    // Cargar imágenes
    this.load.image('player',  'img/player.png');
    this.load.image('invader', 'img/invader.png');
    this.load.image('bullet',  'img/bullet.png');
}


function startGame() {
    if (game) {
        game.destroy(true);  // Destruye el juego actual
        document.getElementById("game-container").innerHTML = ""; // Limpia el contenedor del juego
    }
    
    // Reiniciar balas
    bulletsFired = 0;
    updateBullets();

    // Reiniciar puntaje
    score = 0;
    updateScore(); 

    movingDown = false; 
    game = new Phaser.Game(config);
    document.getElementById("btnStart").textContent = "Reiniciar";
}


function pauseGame() {
    let scene = game.scene.getScene("mainScene");
    // Verificar si la escena está activa antes de pausar
    if (scene.scene.isActive()) {
        console.log('Se hizo click en pausar...');
        document.getElementById("btnPause").textContent = "Seguir";
        scene.scene.pause();  // Pausar la escena
    } else {
        console.log('Se hizo click en seguir...');
        document.getElementById("btnPause").textContent = "Pausar";
        scene.scene.resume();  // Reiniciar la escena actual
    }
}


function countActiveBullets() {
    // Filtrar las balas activas
    let activeBullets = bullets.getChildren().filter(bullet => bullet.active);
    // Retornar el número de balas activas
    return activeBullets.length;
}

function updateBullets() {
    // Calcula cantidad de balas disponibles
    let balasDisponibles = 10 - bulletsFired;
    document.getElementById("bullet").textContent = String(balasDisponibles)
}


function updateScore() {
    // Muestra el puntaje en Bootstrap
    document.getElementById("score").textContent = String(score)
    // document.getElementById("score").textContent = score;
}


function preload() {
    // Cargar imágenes
    this.load.image('player', 'img/player.png');
    this.load.image('invader', 'img/invader.png');
    this.load.image('bullet', 'img/bullet.png');
}


function create() {
    console.log ("Create")
    // Obtener tamaño de la pantalla ajustado
    let screenWidth = this.cameras.main.width;
    let screenHeight = this.cameras.main.height;
    invaderSpeed = 200;

    // Crea las balas (bullet pool)
    bullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: 10, // Número máximo de balas que se pueden crear
        runChildUpdate: true // Esto permite que cada bala tenga su propia lógica de actualización
        });

    // Crear el jugador en el centro inferior
    player = this.physics.add.image(screenWidth / 2, screenHeight - 50, 'player').setOrigin(0.5, 0.5);
    player.setCollideWorldBounds(true);
    
    // Configurar controles
    cursors = this.input.keyboard.createCursorKeys();
    spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Crear el grupo de invasores y posicionarlos en 1 fila, con un espacio fijo
    invaders = this.physics.add.group();
    for (let i = 0; i < invaderCount; i++) {
        let xPos = leftMargin + i * invaderSpacing;
        let invader = this.physics.add.sprite(xPos, invaderY, 'invader');
        // Asignamos la velocidad horizontal inicial hacia la derecha
        invader.setVelocityX(invaderSpeed * invaderDirection);
        invaders.add(invader);
        // console.log(`Invader ${i}: x = ${xPos}, y = ${invaderY}`);
    }
    
    // Crear grupo de balas
    bullets = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image,
        runChildUpdate: true
    });
    
    // Colisiones entre balas e invasores
    this.physics.add.collider(bullets, invaders, hitInvader, null, this);

    // Colisión entre invasores y jugador
    this.physics.add.collider(invaders, player, gameOver, null, this);

}


function update() {
    // Movimiento del jugador
    if (cursors.left.isDown) {
        player.setVelocityX(-200);
    } else if (cursors.right.isDown) {
        player.setVelocityX(200);
    } else {
        player.setVelocityX(0);
    }
    
    // Disparar balas al presionar Space
    //if (spacebar.isDown && this.time.now > bulletTime) {
    //    let bullet = bullets.create(player.x, player.y - 50, 'bullet');
    //    bullet.setVelocityY(-500);
    //    bulletTime = this.time.now + 200;
    //}
    
    // Disparo
    if (spacebar.isDown) {
        // Verificar si no hay balas activas en pantalla
        let activeBullet = bullets.getChildren().find(bullet => bullet.active);
        console.log('Balas activas antes:', countActiveBullets());
        if (!activeBullet && bulletsFired < 10 ) {
            let bullet = bullets.create(player.x, player.y - 50, 'bullet');
            bullet.setVelocityY(-500);
            
            // Incrementar el contador de balas disparadas
            bulletsFired++;
            let balasDisponibles = 10 - bulletsFired;
            document.getElementById("bullet").textContent = String(balasDisponibles);

        }
    }

    // Actualiza la lógica de las balas
    bullets.children.iterate(bullet => {
        if (bullet.active) {
            // Verifica si la bala sale de la pantalla
            if (bullet.y < 0) {
                bullet.setActive(false);
                bullet.setVisible(false); // Desactiva la bala cuando sale de la pantalla
            }
        }
    });

    // Calcular el invasor más a la izquierda y el más a la derecha
    let leftMost = Infinity, rightMost = -Infinity;
    invaders.children.iterate(function(invader) {
        leftMost = Math.min(leftMost, invader.x);
        rightMost = Math.max(rightMost, invader.x);
    });
    
    // Obtener el ancho de un invasor (suponemos que todos son iguales)
    let invaderWidth = 0;
    let invaderArray = invaders.getChildren();
    if (invaderArray.length > 0) {
        invaderWidth = invaderArray[0].width;
    }
    
    // Definir el margen derecho: 50 píxeles desde el borde derecho
    let rightMargin = this.cameras.main.width - 50 - invaderWidth;
    
    // Si el grupo alcanza el extremo correspondiente, invertir la dirección y bajar la fila
    if ((invaderDirection === 1 && rightMost >= rightMargin) || (invaderDirection === -1 && leftMost <= leftMargin)) {
        invaderDirection *= -1;
        invaderSpeed += 100;
        console.log(`invaderSpeed: ${invaderSpeed} movingDown: ${movingDown}`);
        if (!movingDown) {
            movingDown = true;
            invaders.children.iterate(function(invader) {
                invader.y += invaderRowHeight;
            });
            // Permitir bajada nuevamente después de 500 ms
            this.time.delayedCall(500, () => { movingDown = false; }, [], this);
        }
    }
    
    // Actualizar la velocidad horizontal de los invasores según la dirección actual
    invaders.children.iterate(function(invader) {
        invader.setVelocityX(invaderDirection * invaderSpeed);
    });
}


function hitInvader(bullet, invader) {

    // Colisión entre bala e invasor (enemigo)
    bullet.setActive(false);
    bullet.setVisible(false); // Desactiva la bala cuando colisiona con un invasor

    bullet.destroy();
    invader.destroy();

    // Aumentar el puntaje y actualizar el texto
    score += 10;  
    updateScore()

    // Verificar si ya no quedan invasores
    if (invaders.countActive(true) === 0) { // countActive(true) para contar activos
        // Esperar 1/10 segundo antes de detener el juego
        this.time.delayedCall(100, () => {
            alert("¡Has ganado! Los invasores han sido destruidos.");
            document.getElementById("btnStart").textContent = "Iniciar";
            document.getElementById("btnPause").textContent = "Pausar";

            game.destroy(true);  // Destruye el juego actual
            document.getElementById("game-container").innerHTML = ""; // Limpia el contenedor del juego

            bulletsFired = 0; // Reiniciar balas
            updateBullets();

            score = 0;  // Reiniciar puntaje
            updateScore(); 
        });
    }
}


function gameOver(player, invader) {
    let scene = game.scene.getScene("mainScene");
    scene.scene.pause();  // Pausar la escena
    alert("¡Has perdido! Los invasores han llegado a ti.");
    scene.scene.resume();  // Seguir la escena
    document.getElementById("btnStart").textContent = "Iniciar";
    document.getElementById("btnPause").textContent = "Pausar";

    game.destroy(true);  // Destruye el juego actual
    document.getElementById("game-container").innerHTML = ""; // Limpia el contenedor del juego

    score = 0;  // Reiniciar puntaje
    updateScore(); 

    bulletsFired = 0; // Reiniciar balas
    updateBullets();
}

