FROM public.ecr.aws/lambda/nodejs:18

# Set working directory to Lambda task root (it's where the Lambda runtime expects the code to be)
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy function code
COPY index.js pullShows.js spotify.js getOmrToken.js ./

COPY prisma ./prisma/

# Optionally, if you have Prisma schema and migrations inside the prisma directory, you might need to install the Prisma CLI and run migrations
RUN npx prisma generate

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "index.handler" ]
