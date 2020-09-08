from src.main import init, tracer, logger

# Initialize context
init()

@tracer.capture_lambda_handler
@logger.inject_lambda_context
def create_todo(event, context, resource, idTodo):
    return None, "Success"