// Configuración del juego
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,      // Ancho de la pantalla menos 5 píxeles
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
let maxBullet = 15             // Máxima cantidad de balas
let bulletTime = 0;
let invaderSpeed = 200;        // Velocidad horizontal de los invasores
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
    this.load.image('player',  './img/player.png');
    this.load.image('invader', './img/invader.png');
    this.load.image('bullet',  './img/bullet.png');
}


function startGame() {
    if (game) {
        game.destroy(true);  // Destruye el juego actual
        document.getElementById("game-container").innerHTML = ""; // Limpia el contenedor del juego
    }
 
    // Reiniciar variables globales a sus valores iniciales
    bulletsFired = 0;
    invaderSpeed = 200;         // Valor inicial
    invaderDirection = 1;       // Valor inicial
    movingDown = false;
    invaderY = 50;              // Posición Y inicial
    score = 0;
    updateScore();
    updateBullets();

    document.getElementById("btnStart").textContent = "Reiniciar";
    document.getElementById("btnPause").textContent = "Pausar";

    game = new Phaser.Game(config);

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
    let balasDisponibles = maxBullet - bulletsFired;
    document.getElementById("bullet").textContent = String(balasDisponibles)
}


function updateScore() {
    // Muestra el puntaje en Bootstrap
    document.getElementById("score").textContent = String(score)
    // document.getElementById("score").textContent = score;
}


function create() {
    console.log ("Create")
    // Obtener tamaño de la pantalla ajustado
    let screenWidth = this.cameras.main.width;
    let screenHeight = this.cameras.main.height;
    invaderSpeed = 200;

    // Escalar el tamaño del jugador y los invasores en función del ancho de la pantalla
    // let invaderScale = screenWidth / 800; // Ajusta basado en un diseño de referencia de 800px
    // let playerScale = screenWidth / 1000; // Ajusta el jugador basado en el ancho de la pantalla

    let invaderScale;
    if(screenWidth < 800){
        invaderScale = screenWidth / 800;
    } else {
        invaderScale = 1; // O un valor fijo, por ejemplo 1.0 o 1.2
    }

    let playerScale;
    if(screenWidth < 1000){
        playerScale = screenWidth / 1000;
    } else {
        playerScale = 1; // O un valor fijo, por ejemplo 1.0 o 1.2
    }


    // Crear al jugador en el centro inferior
    player = this.physics.add.sprite(screenWidth / 2, screenHeight - 50, "player");
    player.setScale(playerScale); // Escalar jugador
    player.setCollideWorldBounds(true);

    // Crear invasores con tamaño adaptado
    invaders = this.physics.add.group();
    let rows = 3; // Filas de invasores
    let cols = 5; // Columnas
    let invaderSpacing = screenWidth * 0.1; // Espaciado basado en pantalla

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let x = col * invaderSpacing + 50;
            let y = row * 50 + 50;
            let invader = invaders.create(x, y, "invader");
            invader.setScale(invaderScale); // Escalar invasor
        }
    }

    // Crear el grupo de invasores y posicionarlos en 1 fila, con un espacio fijo
    // invaders = this.physics.add.group();
    //for (let i = 0; i < invaderCount; i++) {
    //     let xPos = leftMargin + i * invaderSpacing;
    //     let invader = this.physics.add.sprite(xPos, invaderY, 'invader');
        // Asignamos la velocidad horizontal inicial hacia la derecha
        // invader.setVelocityX(invaderSpeed * invaderDirection);
        // invaders.add(invader);
        // console.log(`Invader ${i}: x = ${xPos}, y = ${invaderY}`);
    // }

    // Crea las balas (bullet pool)
    bullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: maxBullet, // Número máximo de balas que se pueden crear
        runChildUpdate: true // Esto permite que cada bala tenga su propia lógica de actualización
        });

   
    // Configurar controles
    cursors = this.input.keyboard.createCursorKeys();
    spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Controles táctiles
    this.input.on("pointerdown", function (pointer) {
        if (pointer.y < screenHeight / 2) {
            shootBullet();
        } else {
            if (pointer.x < screenWidth / 2) {
                player.setVelocityX(-200); // Mover a la izquierda
            } else {
                player.setVelocityX(200); // Mover a la derecha
            }
        }
    }, this);

    this.input.on("pointerup", function () {
        player.setVelocityX(0); // Detener movimiento cuando suelta el toque
    }, this);
    
    // Crear grupo de balas
    // bullets = this.physics.add.group({
    //    classType: Phaser.Physics.Arcade.Image,
    //    runChildUpdate: true
    // });
    
    // Colisiones entre balas e invasores
    // this.physics.add.collider(bullets, invaders, hitInvader, null, this);
    this.physics.add.overlap(bullets, invaders, hitInvader, null, this);

    // Colisión entre invasores y jugador
    this.physics.add.collider(invaders, player, gameOver, null, this);

}

// Función para disparar
function shootBullet() {
    let bullet = bullets.get(player.x, player.y - 20);
    if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.body.velocity.y = -300;
    }
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
    
    
    // Disparo
    if (spacebar.isDown) {
        // Verificar si no hay balas activas en pantalla
        let activeBullet = bullets.getChildren().find(bullet => bullet.active);
        console.log('Balas activas antes:', countActiveBullets());
        if (!activeBullet && bulletsFired < maxBullet ) {
            let bullet = bullets.create(player.x, player.y - 50, 'bullet');
            bullet.setVelocityY(-500);
            
            // Incrementar el contador de balas disparadas
            bulletsFired++;
            let balasDisponibles = maxBullet - bulletsFired;
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

    // Obtener el ancho de un invasor (asumimos que todos son iguales)
    let invaderWidth = 0;
    let invaderArray = invaders.getChildren();
    if (invaderArray.length > 0) {
        invaderWidth = invaderArray[0].width;
    }

    // Definir los márgenes basándonos en los bordes de los sprites
    let rightMargin = this.cameras.main.width;  // Límite derecho real (100% de ancho)
    let leftMargin = 0;                         // Límite izquierdo en 0

    // Si se mueve a la derecha y el borde derecho del invasor más a la derecha toca el borde de la pantalla,
    // o si se mueve a la izquierda y el borde izquierdo del invasor más a la izquierda toca el borde izquierdo,
    // entonces invertir la dirección y bajar la fila.
    if ((invaderDirection === 1 && rightMost + invaderWidth/2 >= rightMargin) ||
        (invaderDirection === -1 && leftMost - invaderWidth/2 <= leftMargin)) {
        invaderDirection *= -1;

        invaderSpeed += 100;
        console.log(`invaderSpeed: ${invaderSpeed} movingDown: ${movingDown}`);

        // Aquí podrías bajar la fila, etc.
        if (!movingDown) {
            movingDown = true;
            invaders.children.iterate(function(invader) {
                invader.y += invaderRowHeight;
            });
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

